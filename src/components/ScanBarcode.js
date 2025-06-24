import { useState } from "react";
import ScanBarcodeZXing from "./ScanBarcodeZXing";
import ScanBarcodeQuagga from "./ScanBarcodeQuagga";

export default function ScanBarcode({ onResult, onClose }) {
  const [fallback, setFallback] = useState(false);

  if (fallback) {
    return (
      <ScanBarcodeQuagga
        onResult={onResult}
        onClose={onClose}
      />
    );
  }

  return (
    <ScanBarcodeZXing
      onResult={onResult}
      onClose={onClose}
      onError={() => setFallback(true)}
    />
  );
} 