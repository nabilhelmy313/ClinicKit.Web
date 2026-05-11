import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({ selector: '[ckCell]', standalone: true })
export class CkCellDefDirective {
    @Input('ckCell') column!: string;
    constructor(public template: TemplateRef<any>) {}
}
