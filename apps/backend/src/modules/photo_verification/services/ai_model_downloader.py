from pathlib import Path

from huggingface_hub import hf_hub_download


MODEL_REPO = "salmanzaman777/image-forgery-m3"
MODEL_FILENAME = "M3_best.keras"
MODEL_REVISION = "v1"


def get_model_path() -> Path:
    """
    Download the pretrained M3 image-forgery model from Hugging Face
    and return the local cached path.

    The model is downloaded only once and reused from the HF cache.
    """
    model_path = hf_hub_download(
        repo_id=MODEL_REPO,
        filename=MODEL_FILENAME,
        revision=MODEL_REVISION,
    )

    return Path(model_path)