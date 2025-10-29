import { useState, useEffect } from "react";

/**
 * 値の変更を遅延させるカスタムフック（デバウンス）
 * @param value デバウンス対象の値
 * @param delay 遅延時間 (ミリ秒)
 * @returns 遅延された値
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // delayミリ秒後に値を更新するタイマーを設定
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 次のeffectが実行される前、またはアンマウント時にタイマーをクリア
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // value か delay が変わった時だけ再設定

  return debouncedValue;
}

export default useDebounce;
