import { useEffect, useRef } from "react";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

export default function ScanBarcodeZXing({ onResult, onClose, onError }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.ITF]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints, 500);

    reader.listVideoInputDevices().then(async (devices) => {
      const deviceId =
        devices.find((d) => /back|traseira|rear/i.test(d.label))?.deviceId ||
        devices[0]?.deviceId;

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (res, err) => {
          if (res) {
            onResult(res.getText().replace(/\D/g, ""));
            reader.reset();
            onClose();
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error(err);
            onError && onError(err);
          }
        }
      );
    }).catch(error => {
      console.error(error);
      onError && onError(error);
    });

    return () => reader.reset();
  }, [onResult, onClose, onError]);

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      <video ref={videoRef} className="flex-1 object-contain" muted autoPlay />
      <button
        onClick={onClose}
        className="text-white text-lg py-4 font-medium bg-primary"
      >
        Cancelar
      </button>
    </div>
  );
} 