import { QrCode } from "../../pairing/QrCode";

const LINK_QR_SIZE = 190;

interface LinkQrProps {
  url: string;
  caption: string;
}

export const LinkQr = ({ url, caption }: LinkQrProps) => (
  <QrCode value={url} size={LINK_QR_SIZE} caption={caption} />
);
