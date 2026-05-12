import {
    Component, Input, OnInit,
    inject, signal,
} from '@angular/core';
import { CommonModule }           from '@angular/common';
import { MatButtonModule }        from '@angular/material/button';
import { MatIconModule }          from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule }       from '@angular/material/tooltip';

import { TranslatePipe }          from '../../../../core/pipes/translate.pipe';
import { VisitsService }          from '../../../../core/services/visits.service';
import { ToastService }           from '../../../../core/services/toast.service';
import { VisitAttachment, AttachmentCategory } from '../../../../core/models/visit.model';

@Component({
    selector: 'app-visit-attachments',
    standalone: true,
    templateUrl: './visit-attachments.component.html',
    styleUrl: './visit-attachments.component.scss',
    imports: [
        CommonModule,
        MatButtonModule, MatIconModule,
        MatProgressSpinnerModule, MatTooltipModule,
        TranslatePipe,
    ],
})
export class VisitAttachmentsComponent implements OnInit {
    @Input({ required: true }) visitId!: string;

    private readonly visitsSvc = inject(VisitsService);
    private readonly toast     = inject(ToastService);

    attachments = signal<VisitAttachment[]>([]);
    loading     = signal(false);
    uploading   = signal(false);
    selectedFile     = signal<File | null>(null);
    selectedCategory = signal<AttachmentCategory>(AttachmentCategory.Other);

    readonly AttachmentCategory = AttachmentCategory;

    readonly categories = [
        { value: AttachmentCategory.XRay,      label: 'ATTACHMENTS.CATEGORIES.XRAY' },
        { value: AttachmentCategory.LabResult,  label: 'ATTACHMENTS.CATEGORIES.LAB' },
        { value: AttachmentCategory.Document,   label: 'ATTACHMENTS.CATEGORIES.DOCUMENT' },
        { value: AttachmentCategory.Other,      label: 'ATTACHMENTS.CATEGORIES.OTHER' },
    ];

    ngOnInit(): void {
        this.loadAttachments();
    }

    loadAttachments(): void {
        this.loading.set(true);
        this.visitsSvc.getAttachments(this.visitId).subscribe({
            next: data => { this.attachments.set(data); this.loading.set(false); },
            error: ()  => this.loading.set(false),
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) this.selectedFile.set(input.files[0]);
    }

    upload(): void {
        const file = this.selectedFile();
        if (!file) return;

        this.uploading.set(true);
        this.visitsSvc.uploadAttachment(this.visitId, file, this.selectedCategory()).subscribe({
            next: att => {
                this.attachments.update(list => [att, ...list]);
                this.selectedFile.set(null);
                this.uploading.set(false);
            },
            error: () => this.uploading.set(false),
        });
    }

    view(att: VisitAttachment): void {
        this.visitsSvc.getAttachmentBlob(this.visitId, att.id).subscribe(blob => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            // revoke after a delay so the new tab has time to load it
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        });
    }

    download(att: VisitAttachment): void {
        this.visitsSvc.downloadAttachment(this.visitId, att.id, att.fileName);
    }

    deleteAttachment(att: VisitAttachment): void {
        this.visitsSvc.deleteAttachment(this.visitId, att.id).subscribe({
            next: () => this.attachments.update(list => list.filter(a => a.id !== att.id)),
        });
    }

    formatSize(bytes: number): string {
        if (bytes < 1024)        return bytes + ' B';
        if (bytes < 1_048_576)   return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1_048_576).toFixed(1) + ' MB';
    }

    fileIcon(contentType: string): string {
        if (contentType.startsWith('image/'))    return 'image';
        if (contentType === 'application/pdf')   return 'picture_as_pdf';
        if (contentType.includes('word') ||
            contentType.includes('excel') ||
            contentType.includes('spreadsheet')) return 'description';
        return 'attach_file';
    }

    fileIconType(contentType: string): string {
        if (contentType.startsWith('image/'))    return 'image';
        if (contentType === 'application/pdf')   return 'pdf';
        if (contentType.includes('word') ||
            contentType.includes('excel') ||
            contentType.includes('spreadsheet')) return 'doc';
        return 'other';
    }

    categoryLabel(cat: AttachmentCategory): string {
        return this.categories.find(c => c.value === cat)?.label ?? 'ATTACHMENTS.CATEGORIES.OTHER';
    }
}
