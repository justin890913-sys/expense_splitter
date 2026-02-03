import { useEffect } from 'react';

interface AdBannerProps {
  dataAdSlot: string; // 這是廣告單元的 ID
}

const AdBanner = ({ dataAdSlot }: AdBannerProps) => {
  useEffect(() => {
    try {
      // 每次元件掛載時，通知 Google 載入廣告
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className="my-4 flex justify-center overflow-hidden">
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="pub-8929632939417590" // 替換成你的 ID
           data-ad-slot={dataAdSlot}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdBanner;
