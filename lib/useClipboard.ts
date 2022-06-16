import { useState, useCallback } from "react";

const useClipboard = ({ text }: { text: string }) => {
  const [isHot, setIsHot] = useState<boolean>(false);

  const copyText = useCallback(() => {
    window.navigator.clipboard.writeText(text);
    setIsHot(true);
    setTimeout(() => {
      setIsHot(false);
    }, 3000);
  }, [text]);

  return {
    isHot,
    copyText,
  };
};

export default useClipboard;
