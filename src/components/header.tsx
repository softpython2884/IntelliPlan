import { FileDown, FileUp, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onClear: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Header({ onClear, onExport, onImport }: HeaderProps) {

  return (
    <header className="flex items-center justify-between p-2 border-b bg-card shrink-0">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary/20 text-primary rounded-lg">
          <Zap className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold font-headline">IntelliPlan</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button asChild variant="outline" size="sm">
            <label className="cursor-pointer">
              <FileUp className="w-4 h-4 mr-2" />
              Import
              <input type="file" className="hidden" accept=".json" onChange={onImport} />
            </label>
        </Button>
        <Button variant="default" size="sm" onClick={onExport}>
          <FileDown className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
    </header>
  );
}
