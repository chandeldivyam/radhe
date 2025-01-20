import logging
import json
from datetime import datetime
from opensearchpy import OpenSearch
from app.core.config import settings

class OpenSearchHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self._initialize_client()
        self.index_name = f"{settings.PROJECT_NAME}-logs-{datetime.now().strftime('%Y-%m')}"
        # Set up console handler for internal errors
        self.console_handler = logging.StreamHandler()
        self.console_handler.setFormatter(logging.Formatter('%(message)s'))

    def _initialize_client(self):
        # Disable opensearch-py internal logging
        logging.getLogger('opensearch').setLevel(logging.WARNING)
        logging.getLogger('elastic_transport').setLevel(logging.WARNING)
        
        self.client = OpenSearch(
            hosts=[{
                'host': settings.OPENSEARCH_HOST,
                'port': int(settings.OPENSEARCH_PORT)
            }],
            http_auth=None,
            use_ssl=False,
            verify_certs=False,
            ssl_show_warn=False,
            timeout=30,
            retry_on_timeout=True,
            max_retries=3
        )

    def emit(self, record):
        # Skip logs from opensearch-related loggers
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

            # Ensure index exists
            if not hasattr(self, '_index_created'):
                self._ensure_index_exists()
                self._index_created = True

            self.client.index(
                index=self.index_name,
                body=log_entry,
                refresh=True
            )
        except Exception as e:
            # Log errors to console without going through the logging system
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

    def _ensure_index_exists(self):
        try:
            if not self.client.indices.exists(index=self.index_name):
                self._create_index()
        except Exception as e:
            self.console_handler.emit(
                logging.LogRecord(
                    name='opensearch_handler',
                    level=logging.ERROR,
                    pathname='',
                    lineno=0,
                    msg=f"Failed to check/create index: {str(e)}",
                    args=(),
                    exc_info=None
                )
            )

    def _create_index(self):
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
        
        self.client.indices.create(
            index=self.index_name,
            body=mapping
        )

def setup_logging():
    # Remove any existing handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    
    # Create OpenSearch handler
    opensearch_handler = OpenSearchHandler()
    opensearch_handler.setLevel(logging.INFO)
    
    # Create formatter
    opensearch_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    opensearch_handler.setFormatter(opensearch_formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Add handlers
    root_logger.addHandler(console_handler)
    root_logger.addHandler(opensearch_handler)
    
    return root_logger