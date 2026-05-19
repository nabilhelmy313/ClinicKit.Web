import { Injectable, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

/** Reactive breakpoint utilities. Inject wherever you need responsive behaviour. */
@Injectable({ providedIn: 'root' })
export class BreakpointService {
    private readonly bp = inject(BreakpointObserver);

    /** True on phones and portrait tablets — use for datepicker touchUi, etc. */
    readonly isMobile = toSignal(
        this.bp.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
            .pipe(map(r => r.matches)),
        { initialValue: false },
    );
}
