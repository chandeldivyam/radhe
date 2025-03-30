import cv2
import os
import requests
import tempfile
from typing import List
from deepgram import DeepgramClient, PrerecordedOptions, FileSource
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def download_video(video_url: str) -> str:
    """
    Downloads a video from a URL to a temporary file.
    
    Args:
        video_url (str): URL of the video to download.
    
    Returns:
        str: Path to the downloaded temporary video file.
    
    Raises:
        Exception: If the download fails.
    """
    try:
        response = requests.get(video_url, stream=True)
        response.raise_for_status()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
            for chunk in response.iter_content(chunk_size=8192):
                tmp_file.write(chunk)
            return tmp_file.name
    except Exception as e:
        logger.error(f"Failed to download video from {video_url}: {e}")
        raise

def extract_frames(video_path: str, output_dir: str, threshold: float = 0.5, fps_target: float = 1.0) -> List[str]:
    """
    Extracts important frames from a video based on histogram differences, overlays frame numbers,
    and saves them to the output directory. Samples frames to target FPS before processing.
    
    Args:
        video_path (str): Path to the video file.
        output_dir (str): Directory to save extracted frames.
        threshold (float): Histogram difference threshold for frame selection.
        fps_target (float): Target frames per second to sample (default: 1.0).
    
    Returns:
        List[str]: List of paths to saved frame images.
    
    Raises:
        ValueError: If the video cannot be opened or is empty.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file {video_path}")
    
    # Get video properties
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Calculate frame sampling interval
    if fps_target >= original_fps:
        # If target FPS is higher than original, use all frames
        sampling_interval = 1
    else:
        # Otherwise, calculate how many frames to skip
        sampling_interval = max(1, int(original_fps / fps_target))
    
    logger.info(f"Video properties: {total_frames} frames at {original_fps} FPS")
    logger.info(f"Sampling interval: {sampling_interval} (target: {fps_target} FPS)")
    
    ret, prev_frame = cap.read()
    if not ret:
        cap.release()
        raise ValueError("Video file is empty or unreadable")
    
    image_paths = []
    frame_count = 1
    processed_count = 1
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 2.0
    font_thickness = 4
    
    # Save the first frame
    frame_to_save = prev_frame.copy()
    height, width = frame_to_save.shape[:2]
    text = f"frame_{frame_count}"
    text_size = cv2.getTextSize(text, font, font_scale, font_thickness)[0]
    text_x = (width - text_size[0]) // 2
    text_y = text_size[1] + 50
    # Draw text with black outline and yellow fill
    for dx, dy in [(-1, -1), (1, -1), (-1, 1), (1, 1)]:
        cv2.putText(frame_to_save, text, (text_x + dx, text_y + dy), font, font_scale, (0, 0, 0), font_thickness + 1)
    cv2.putText(frame_to_save, text, (text_x, text_y), font, font_scale, (0, 255, 255), font_thickness)
    output_path = os.path.join(output_dir, f"frame_{frame_count}.jpg")
    cv2.imwrite(output_path, frame_to_save)
    image_paths.append(output_path)
    
    # Calculate histogram for first frame
    prev_hist = cv2.calcHist([prev_frame], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
    prev_hist = cv2.normalize(prev_hist, prev_hist).flatten()
    accumulator = 0.0
    
    frame_position = 1  # Current position in the video
    
    while True:
        # Skip frames according to sampling interval
        if frame_position % sampling_interval != 0:
            ret = cap.grab()  # Just grab the frame without decoding
            if not ret:
                break
            frame_position += 1
            continue
            
        ret, curr_frame = cap.read()
        if not ret:
            break
            
        frame_position += 1
        processed_count += 1
        
        # Process the sampled frame
        curr_hist = cv2.calcHist([curr_frame], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
        curr_hist = cv2.normalize(curr_hist, curr_hist).flatten()
        distance = cv2.compareHist(prev_hist, curr_hist, cv2.HISTCMP_BHATTACHARYYA)
        accumulator += distance
        
        if accumulator >= threshold:
            frame_count += 1
            frame_to_save = curr_frame.copy()
            text = f"frame_{frame_count}"
            text_size = cv2.getTextSize(text, font, font_scale, font_thickness)[0]
            text_x = (width - text_size[0]) // 2
            text_y = text_size[1] + 50
            for dx, dy in [(-1, -1), (1, -1), (-1, 1), (1, 1)]:
                cv2.putText(frame_to_save, text, (text_x + dx, text_y + dy), font, font_scale, (0, 0, 0), font_thickness + 1)
            cv2.putText(frame_to_save, text, (text_x, text_y), font, font_scale, (0, 255, 255), font_thickness)
            output_path = os.path.join(output_dir, f"frame_{frame_count}.jpg")
            cv2.imwrite(output_path, frame_to_save)
            image_paths.append(output_path)
            accumulator = 0.0
            prev_hist = curr_hist.copy()
        else:
            prev_hist = curr_hist.copy()
    
    cap.release()
    logger.info(f"Processed {processed_count} frames out of {total_frames} total frames")
    logger.info(f"Extracted {len(image_paths)} key frames")
    return image_paths

def generate_transcript(video_path: str) -> str:
    """
    Generates a transcript from a video’s audio using Deepgram.
    
    Args:
        video_path (str): Path to the video file.
    
    Returns:
        str: Transcribed text.
    
    Raises:
        Exception: If transcription fails.
    """
    try:
        if not settings.DEEPGRAM_API_KEY:
            raise ValueError("Deepgram API key not found")
        with open(video_path, 'rb') as file:
            buffer = file.read()
        payload: FileSource = {"buffer": buffer}
        options = PrerecordedOptions(model="nova-3", smart_format=True, language="en")
        client = DeepgramClient(settings.DEEPGRAM_API_KEY)
        response = client.listen.rest.v("1").transcribe_file(payload, options)
        transcription = response.to_json(indent=4)
        transcription_json = json.loads(transcription)
        return transcription_json['results']['channels'][0]['alternatives'][0]['transcript']
    except Exception as e:
        logger.error(f"Failed to generate transcript for {video_path}: {e}")
        raise