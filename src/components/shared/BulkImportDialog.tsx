'use client';

import { useState, useRef } from 'react';
import { useTranslations } from '@/i18n/index';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { parseExcelFile } from '@/lib/excel';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';


interface BulkImportDialogProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: T[]) => Promise<void>;
  title: string;
  description: string;
  columnMapping: Record<string, keyof T>;
  requiredFields?: Array<keyof T>;
  sampleTemplateUrl?: string;
}

export function BulkImportDialog<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  onImport,
  title,
  description,
  columnMapping,
  requiredFields = [],
  sampleTemplateUrl
}: BulkImportDialogProps<T>) {
  const t = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<T[]>([]);
  const [validationErrors, setValidationErrors] = useState<Array<{ row: number; column: string; message: string }>>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error(t('excel_format_error'));
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setValidationErrors([]);

    try {
      const result = await parseExcelFile<T>(selectedFile, columnMapping, requiredFields);
      setPreviewData(result.data);
      setValidationErrors(result.errors);

      if (result.errors.length > 0) {
        toast.warning(t('validation_errors_found').replace('{count}', String(result.errors.length)));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('excel_parse_error');
      toast.error(message);
      logger.error('[BulkImport] parse error', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;
    if (validationErrors.length > 0) {
      toast.error(t('fix_validation_errors'));
      return;
    }

    setIsImporting(true);
    try {
      await onImport(previewData);
      toast.success(t('import_success').replace('{count}', String(previewData.length)));
      handleClose();
    } catch {
      toast.error(t('import_failed'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <FileSpreadsheet className="size-6 text-green-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 py-4">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-64 border-2 border-dashed border-muted-foreground/20 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all group"
            >
              <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Upload className="size-8 text-primary/70" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">{t('click_drag_excel')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('excel_formats_supported')}</p>
              </div>
              <Input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
              />
              {sampleTemplateUrl && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  render={<a href={sampleTemplateUrl} download>{t('download_template')}</a>}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileSpreadsheet className="size-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-medium">{(file.size / 1024).toFixed(1)} KB • {previewData.length} {t('rows_detected')}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setFile(null)} className="h-9">{t('change_file')}</Button>
              </div>

              {isParsing ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="size-10 animate-spin text-primary" />
                  <p className="text-base font-medium text-muted-foreground">{t('analyzing_file')}</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                  {validationErrors.length > 0 && (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl overflow-hidden shrink-0">
                      <div className="bg-destructive/10 px-4 py-2 flex items-center gap-2">
                        <XCircle className="size-4 text-destructive" />
                        <span className="text-sm font-bold text-destructive">{t('validation_errors')} ({validationErrors.length})</span>
                      </div>
                      <div className="h-32 overflow-y-auto">
                        <div className="p-3 space-y-2">
                          {validationErrors.map((err, i) => (
                            <div key={i} className="text-xs flex items-start gap-2">
                              <span className="font-bold text-destructive min-w-[60px]">Row {err.row}:</span>
                              <span className="text-muted-foreground font-medium">Column {'"'}{err.column}{'"'} - {err.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col min-h-0">
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary" />
                      {t('data_preview')}
                    </h4>
                    <div className="border rounded-xl overflow-hidden flex-1 flex flex-col">
                      <div className="flex-1 overflow-auto">
                        <Table>
                          <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                              {Object.keys(columnMapping).map((col) => (
                                <TableHead key={col} className="font-bold text-foreground py-3">{col}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.slice(0, 5).map((row, i) => (
                              <TableRow key={i} className="hover:bg-muted/20">
                                {Object.values(columnMapping).map((key) => (
                                  <TableCell key={String(key)} className="py-3 font-medium">{String(row[key] ?? '-')}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 gap-3 border-t bg-muted/10">
          <Button variant="ghost" onClick={handleClose} className="font-bold">{t('cancel')}</Button>
          <Button
            disabled={!file || previewData.length === 0 || validationErrors.length > 0 || isImporting || isParsing}
            onClick={handleImport}
            className="gap-2 px-8 font-bold shadow-lg shadow-primary/20"
          >
            {isImporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {t('import')} {previewData.length > 0 ? previewData.length : ''} {t('records')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
