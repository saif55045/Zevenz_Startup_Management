import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageCropper.css';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({
        unit: '%',
        width: 80,
        aspect: 1
    });
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);

    const onLoad = useCallback((img) => {
        imgRef.current = img;
        // Center the initial crop
        const { width, height } = img;
        const cropSize = Math.min(width, height) * 0.8;
        setCrop({
            unit: 'px',
            x: (width - cropSize) / 2,
            y: (height - cropSize) / 2,
            width: cropSize,
            height: cropSize,
            aspect: 1
        });
    }, []);

    const getCroppedImg = () => {
        const image = imgRef.current;
        if (!image || !completedCrop?.width || !completedCrop?.height) {
            return;
        }

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Output size (avatar size)
        const outputSize = 300;
        canvas.width = outputSize;
        canvas.height = outputSize;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            outputSize,
            outputSize
        );

        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        onCropComplete(base64);
    };

    return (
        <div className="cropper-modal-overlay" onClick={onCancel}>
            <div className="cropper-modal" onClick={e => e.stopPropagation()}>
                <h3>Crop Your Photo</h3>
                <p className="cropper-hint">Drag to adjust the selection</p>

                <div className="cropper-container">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        circularCrop
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Crop preview"
                            onLoad={(e) => onLoad(e.target)}
                            style={{ maxHeight: '400px', maxWidth: '100%' }}
                        />
                    </ReactCrop>
                </div>

                <div className="cropper-actions">
                    <button className="btn btn-ghost" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={getCroppedImg}>
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
