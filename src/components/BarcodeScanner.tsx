import { useEffect, useRef, useState } from "react";
import { isBarcode } from "../api/barcodes";

interface Props {
  /** Chamado uma vez com os dígitos lidos (ou escritos). */
  onScan: (barcode: string) => void;
}

// BarcodeDetector não existe em todos os browsers (o Safari do iPhone não o tem).
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
declare const BarcodeDetector:
  | (new (options: { formats: string[] }) => BarcodeDetectorLike)
  | undefined;

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "itf"];

/**
 * Câmara do telemóvel a ler o código de barras, com um campo para o escrever à mão
 * (câmara recusada, sem câmara, código gasto). Ler é sempre opcional.
 */
export function BarcodeScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [typed, setTyped] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let stopZxing: (() => void) | null = null;

    function found(value: string) {
      if (stopped || !isBarcode(value)) return;
      stopped = true;
      onScanRef.current(value);
    }

    async function start() {
      const video = videoRef.current;
      if (!video || !navigator.mediaDevices?.getUserMedia) {
        setCameraError("Este browser não deixa usar a câmara. Escreve o código.");
        return;
      }
      try {
        if (typeof BarcodeDetector !== "undefined") {
          const detector = new BarcodeDetector({ formats: FORMATS });
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (stopped) return;
          video.srcObject = stream;
          await video.play();
          const tick = async () => {
            if (stopped) return;
            try {
              const [first] = await detector.detect(video);
              if (first) return found(first.rawValue);
            } catch {
              // Um fotograma que falha não pára a leitura.
            }
            setTimeout(tick, 250);
          };
          void tick();
          return;
        }

        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (stopped) return;
        const controls = await new BrowserMultiFormatReader().decodeFromConstraints(
          { video: { facingMode: "environment" } },
          video,
          (result) => result && found(result.getText()),
        );
        stopZxing = () => controls.stop();
        if (stopped) controls.stop();
      } catch {
        setCameraError("Não consegui abrir a câmara. Dá-lhe permissão ou escreve o código.");
      }
    }

    void start();
    return () => {
      stopped = true;
      stopZxing?.();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const digits = typed.replace(/\s/g, "");

  return (
    <div className="barcode-scanner">
      {cameraError ? (
        <p className="muted">{cameraError}</p>
      ) : (
        <video ref={videoRef} className="barcode-video" muted playsInline aria-label="Câmara a ler o código de barras" />
      )}
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (isBarcode(digits)) onScan(digits);
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          aria-label="Código de barras"
          placeholder="Ou escreve o código"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
        <button type="submit" className="button-secondary" disabled={!isBarcode(digits)}>
          Procurar
        </button>
      </form>
    </div>
  );
}
