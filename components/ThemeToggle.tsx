import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Select from "./Select";

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      className="px-2 py-1 text-sm"
    >
      <option value="system">Theme: System</option>
      <option value="light">Theme: Light</option>
      <option value="dark">Theme: Dark</option>
    </Select>
  );
};

export default ThemeToggle;
