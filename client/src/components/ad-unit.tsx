import { useEffect } from "react";

export function DisplayAdUnit() {
  useEffect(() => {
    // Push the ad to display
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log("AdSense not ready yet");
    }
  }, []);

  return (
    <div className="my-8">
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
        }}
        data-ad-client="ca-pub-7582927448006974"
        data-ad-slot="2698682079"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
