import cv2
import mediapipe as mp
from config.presence_detection import *

# --- Face detection: MediaPipe (Apache-2.0), replaces YOLO/ultralytics (AGPL-3.0) ---
face_detector = mp.solutions.face_detection.FaceDetection(
    model_selection=FACE_DETECTION_MODEL,
    min_detection_confidence=FACE_DETECTION_MIN_CONFIDENCE)

# --- Setup MediaPipe FaceMesh (frontal / "looking at the screen" check) ---
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False, max_num_faces=1, refine_landmarks=True)


def detect_faces(frame):
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_detector.process(frame_rgb)

    if not results.detections:
        return False

    h, w = frame_rgb.shape[:2]
    for detection in results.detections:
        box = detection.location_data.relative_bounding_box
        # pad the box so FaceMesh sees the whole head, not a tight crop
        pad_x = box.width * FACE_BOX_PADDING
        pad_y = box.height * FACE_BOX_PADDING
        x1 = max(0, int((box.xmin - pad_x) * w))
        y1 = max(0, int((box.ymin - pad_y) * h))
        x2 = min(w, int((box.xmin + box.width + pad_x) * w))
        y2 = min(h, int((box.ymin + box.height + pad_y) * h))

        face_roi_rgb = frame_rgb[y1:y2, x1:x2]
        if face_roi_rgb.size == 0:
            continue

        if apply_media_pipe(face_roi_rgb):
            return True

    return False


def apply_media_pipe(face_roi_rgb):
    mesh_results = face_mesh.process(face_roi_rgb)

    if mesh_results.multi_face_landmarks:
        landmarks = mesh_results.multi_face_landmarks[0].landmark
        return is_frontal_face(landmarks)
    return False


def is_frontal_face(landmarks):
    left_eye = landmarks[33]
    right_eye = landmarks[263]
    nose_tip = landmarks[1]
    eye_diff = abs(left_eye.x - (1 - right_eye.x))
    nose_centered = abs(nose_tip.x - 0.5)
    return nose_centered < FRONTAL_FACE_THRESHOLD and eye_diff < EYE_DIFFERENCE
