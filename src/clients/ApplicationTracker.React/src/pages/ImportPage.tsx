import {useRef, useState} from 'react';
import {type ExcelImportResult, importExcel} from '@/api/applicationRecords';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {toast} from 'sonner';
import {FileUp, Download} from 'lucide-react';

export function ImportPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ExcelImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    setResult(null);
    try {
      const importResult = await importExcel(file);
      setResult(importResult);
      toast.success(
        `Imported ${importResult.importedCount} of ${importResult.totalRows} records`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Import Applications</h2>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
          <CardDescription>
            Import application records from an Excel (.xlsx) file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="text-sm file:mr-4 file:rounded-md file:border file:border-input file:bg-background
              file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"/>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Button onClick={handleUpload} disabled={isUploading}>
              <FileUp className="h-4 w-4 mr-2"/>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
            <a
              href="/templates/ApplicationRecords_Import_Template.xlsx"
              download
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Download className="h-4 w-4"/>
              Download import template
            </a>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>
              {result.importedCount} of {result.totalRows} records imported
              {Number(result.failedCount) > 0 && (
                <span className="text-destructive">
                    {' '}— {result.failedCount} failed
                  </span>
              )}
            </CardDescription>
          </CardHeader>
          {result.errors && result.errors.length > 0 && (
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell>{error.rowNumber}</TableCell>
                      <TableCell>{error.companyName ?? '—'}</TableCell>
                      <TableCell className="text-destructive">
                        {error.errorMessage}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
