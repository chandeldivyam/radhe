# logging.py
import logging
import json
from datetime import datetime
from opensearchpy import AsyncOpenSearch
from app.core.config import settings
from fastapi import Request
import asyncio

class AsyncOpenSearchHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self._initialize_client()
        self.app_index = f"{settings.PROJECT_NAME}-logs-{datetime.now().strftime('%Y-%m')}"
        self.request_index = f"{settings.PROJECT_NAME}-requests-{datetime.now().strftime('%Y-%m')}"
        self.console_handler = logging.StreamHandler()
        self.console_handler.setFormatter(logging.Formatter('%(message)s'))
        self._app_index_created = False
        self._request_index_created = False

    def _initialize_client(self):
        logging.getLogger('opensearch').setLevel(logging.WARNING)
        logging.getLogger('elastic_transport').setLevel(logging.WARNING)

        client_kwargs = {
            'hosts': [{'host': settings.OPENSEARCH_HOST, 'port': int(settings.OPENSEARCH_PORT)}],
            'timeout': 30,
            'retry_on_timeout': True,
            'max_retries': 3
        }
        
        # Production configuration
        if settings.ENVIRONMENT.lower() == 'production':
            client_kwargs.update({
                'use_ssl': True,
                'verify_certs': False,
                'http_auth': (settings.OPENSEARCH_USER, settings.OPENSEARCH_INITIAL_ADMIN_PASSWORD),
            })
        else:
            # Development configuration
            client_kwargs.update({
                'use_ssl': False,
                'verify_certs': False,
                'ssl_show_warn': False,
                'http_auth': None
            })

        self.client = AsyncOpenSearch(**client_kwargs)

    async def log_request(self, request: Request, request_id: str):
        try:
            # Read request body
            body = None
            if request.method in ['POST', 'PUT', 'PATCH']:
                body = await request.body()
                try:
                    body = json.loads(body)
                except:
                    body = str(body)

            # Create request log entry
            request_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'request_id': request_id,
                'method': request.method,
                'url': str(request.url),
                'path': request.url.path,
                'query_params': dict(request.query_params),
                'headers': dict(request.headers),
                'client_host': request.client.host if request.client else None,
                'body': body if body else None,
                'endpoint': request.url.path.split('/')[-1],
                'api_version': 'v1' if '/v1/' in request.url.path else 'unknown',
                'api_group': next((segment for segment in request.url.path.split('/') 
                                if segment not in ['api', 'v1', '']), 'unknown')
            }

            # Ensure index exists
            if not self._request_index_created:
                await self._ensure_request_index_exists()
                self._request_index_created = True

            await self.client.index(
                index=self.request_index,
                body=request_entry,
                refresh=True
            )
        except Exception as e:
            self.console_handler.emit(
                logging.LogRecord(
                    name='opensearch_handler',
                    level=logging.ERROR,
                    pathname='',
                    lineno=0,
                    msg=f"Failed to log request: {str(e)}",
                    args=(),
                    exc_info=None
                )
            )

    async def async_emit(self, record):
        if record.name.startswith(('opensearch', 'elastic_transport')):
            return

        try:
            log_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'level': record.levelname,
                'message': record.getMessage(),
                'module': record.module,
                'function': record.funcName,
                'line': record.lineno,
                'logger_name': record.name
            }
            
            if hasattr(record, 'request_id'):
                log_entry['request_id'] = record.request_id

            if record.exc_info:
                log_entry['exception'] = self.formatter.formatException(record.exc_info)

            if not self._app_index_created:
                await self._ensure_app_index_exists()
                self._app_index_created = True

            await self.client.index(
                index=self.app_index,
                body=log_entry,
                refresh=True
            )
        except Exception as e:
            self.console_handler.emit(
                logging.LogRecord(
                    name='opensearch_handler',
                    level=logging.ERROR,
                    pathname='',
                    lineno=0,
                    msg=f"Failed to send log to OpenSearch: {str(e)}",
                    args=(),
                    exc_info=None
                )
            )

    def emit(self, record):
        # Create a new event loop if one doesn't exist
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Run async_emit in the event loop
        loop.create_task(self.async_emit(record))

    async def _ensure_app_index_exists(self):
        if not await self.client.indices.exists(index=self.app_index):
            await self._create_app_index()
        self._app_index_created = True

    async def _ensure_request_index_exists(self):
        if not await self.client.indices.exists(index=self.request_index):
            await self._create_request_index()
        self._request_index_created = True

    async def _create_app_index(self):
        mapping = {
            "mappings": {
                "properties": {
                    "timestamp": {"type": "date"},
                    "level": {"type": "keyword"},
                    "message": {"type": "text"},
                    "module": {"type": "keyword"},
                    "function": {"type": "keyword"},
                    "line": {"type": "integer"},
                    "logger_name": {"type": "keyword"},
                    "request_id": {"type": "keyword"},
                    "exception": {"type": "text"}
                }
            },
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            }
        }
        await self.client.indices.create(index=self.app_index, body=mapping)

    async def _create_request_index(self):
        mapping = {
            "mappings": {
                "properties": {
                    "timestamp": {"type": "date"},
                    "request_id": {"type": "keyword"},
                    "method": {"type": "keyword"},
                    "url": {"type": "keyword"},
                    "path": {"type": "keyword"},
                    "query_params": {"type": "object"},
                    "headers": {"type": "object"},
                    "body": {"type": "object"},
                    "client_host": {"type": "ip"},
                    "endpoint": {"type": "keyword"},
                    "api_version": {"type": "keyword"},
                    "api_group": {"type": "keyword"}
                }
            },
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            }
        }
        await self.client.indices.create(index=self.request_index, body=mapping)

    async def close(self):
        await self.client.close()

def setup_logging():
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler setup
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(console_formatter)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)
    
    # Only add OpenSearch handler in production
    opensearch_handler = None
    if settings.ENVIRONMENT.lower() == 'production':
        opensearch_handler = AsyncOpenSearchHandler()
        opensearch_handler.setLevel(logging.INFO)
        opensearch_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        opensearch_handler.setFormatter(opensearch_formatter)
        root_logger.addHandler(opensearch_handler)
    
    return root_logger, opensearch_handler