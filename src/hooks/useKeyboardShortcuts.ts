import { useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) => {
  const { toast } = useToast();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const showShortcutsHelp = useCallback(() => {
    const helpText = shortcuts
      .map((s) => {
        const keys = [];
        if (s.ctrl) keys.push("Ctrl");
        if (s.shift) keys.push("Shift");
        if (s.alt) keys.push("Alt");
        keys.push(s.key.toUpperCase());
        return `${keys.join("+")} - ${s.description}`;
      })
      .join("\n");

    toast({
      title: "Keyboard Shortcuts",
      description: helpText,
      duration: 5000,
    });
  }, [shortcuts, toast]);

  return { showShortcutsHelp };
};
