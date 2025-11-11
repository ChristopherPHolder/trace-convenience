import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilmStripComponent } from './film-strip';
import { Screenshot } from '../../services/trace-parser.service';

describe('FilmStripComponent', () => {
  let component: FilmStripComponent;
  let fixture: ComponentFixture<FilmStripComponent>;

  const mockScreenshots: Screenshot[] = [
    { timestamp: 1000000, data: 'base64data1', format: 'jpeg' },
    { timestamp: 2000000, data: 'base64data2', format: 'jpeg' },
    { timestamp: 3000000, data: 'base64data3', format: 'jpeg' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilmStripComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilmStripComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('screenshots', mockScreenshots);
    fixture.componentRef.setInput('startTime', 0);
    fixture.componentRef.setInput('endTime', 3000000);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('screenshots display', () => {
    it('should display screenshots when provided', () => {
      const frames = fixture.nativeElement.querySelectorAll('.film-frame');
      expect(frames.length).toBe(3);
    });

    it('should show empty state when no screenshots', () => {
      fixture.componentRef.setInput('screenshots', []);
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.film-strip-empty');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No screenshots found');
    });

    it('should display screenshot count in header', () => {
      const header = fixture.nativeElement.querySelector('.film-strip-header');
      expect(header.textContent).toContain('3 screenshots');
    });
  });

  describe('screenshot selection', () => {
    it('should select screenshot on click', () => {
      const frames = fixture.nativeElement.querySelectorAll('.film-frame');
      frames[1].click();
      fixture.detectChanges();

      expect(component['selectedIndex']()).toBe(1);
      expect(frames[1].classList.contains('selected')).toBe(true);
    });

    it('should show preview overlay when screenshot selected', () => {
      component['onSelectScreenshot'](0);
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.preview-overlay');
      expect(overlay).toBeTruthy();
    });

    it('should close preview when clicking close button', () => {
      component['onSelectScreenshot'](0);
      fixture.detectChanges();

      const closeBtn = fixture.nativeElement.querySelector('.preview-header .btn-icon:last-child');
      closeBtn.click();
      fixture.detectChanges();

      expect(component['selectedIndex']()).toBeNull();
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      component['onSelectScreenshot'](1);
      fixture.detectChanges();
    });

    it('should navigate to previous screenshot', () => {
      component['onNavigatePrevious']();
      expect(component['selectedIndex']()).toBe(0);
    });

    it('should navigate to next screenshot', () => {
      component['onNavigateNext']();
      expect(component['selectedIndex']()).toBe(2);
    });

    it('should not navigate before first screenshot', () => {
      component['selectedIndex'].set(0);
      component['onNavigatePrevious']();
      expect(component['selectedIndex']()).toBe(0);
    });

    it('should not navigate after last screenshot', () => {
      component['selectedIndex'].set(2);
      component['onNavigateNext']();
      expect(component['selectedIndex']()).toBe(2);
    });

    it('should navigate with arrow keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      component['onKeydown'](event);
      expect(component['selectedIndex']()).toBe(2);

      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      component['onKeydown'](leftEvent);
      expect(component['selectedIndex']()).toBe(1);
    });

    it('should close preview with Escape key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component['onKeydown'](event);
      expect(component['selectedIndex']()).toBeNull();
    });
  });

  describe('fullscreen mode', () => {
    it('should toggle fullscreen mode', () => {
      expect(component['isFullscreen']()).toBe(false);
      
      component['onToggleFullscreen']();
      expect(component['isFullscreen']()).toBe(true);
      
      component['onToggleFullscreen']();
      expect(component['isFullscreen']()).toBe(false);
    });

    it('should toggle fullscreen with F key', () => {
      component['onSelectScreenshot'](0);
      
      const event = new KeyboardEvent('keydown', { key: 'f' });
      component['onKeydown'](event);
      expect(component['isFullscreen']()).toBe(true);
    });
  });

  describe('computed properties', () => {
    it('should compute hasScreenshots correctly', () => {
      expect(component['hasScreenshots']()).toBe(true);
      
      fixture.componentRef.setInput('screenshots', []);
      expect(component['hasScreenshots']()).toBe(false);
    });

    it('should compute screenshotsWithMetadata', () => {
      const metadata = component['screenshotsWithMetadata']();
      
      expect(metadata.length).toBe(3);
      expect(metadata[0].index).toBe(0);
      expect(metadata[0].dataUri).toContain('data:image/jpeg;base64,');
      expect(metadata[1].delta).toBeGreaterThan(0);
    });

    it('should compute selectedScreenshot', () => {
      expect(component['selectedScreenshot']()).toBeNull();
      
      component['onSelectScreenshot'](1);
      const selected = component['selectedScreenshot']();
      
      expect(selected).toBeTruthy();
      expect(selected?.index).toBe(1);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels on frames', () => {
      const frame = fixture.nativeElement.querySelector('.film-frame');
      expect(frame.getAttribute('aria-label')).toContain('Screenshot at');
      expect(frame.getAttribute('role')).toBe('button');
      expect(frame.getAttribute('tabindex')).toBe('0');
    });

    it('should handle keyboard events on frames', () => {
      const frame = fixture.nativeElement.querySelector('.film-frame');
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      frame.dispatchEvent(enterEvent);
      fixture.detectChanges();
      
      expect(component['selectedIndex']()).toBe(0);
    });

    it('should have proper dialog role on preview', () => {
      component['onSelectScreenshot'](0);
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.preview-overlay');
      expect(overlay.getAttribute('role')).toBe('dialog');
      expect(overlay.getAttribute('aria-modal')).toBe('true');
    });
  });

  describe('metadata display', () => {
    it('should display relative time for each screenshot', () => {
      const frameInfo = fixture.nativeElement.querySelectorAll('.frame-info');
      expect(frameInfo.length).toBe(3);
      
      const times = Array.from(frameInfo).map((info: Element) => 
        info.querySelector('.frame-time')?.textContent
      );
      expect(times.every((time: string) => time && time.length > 0)).toBe(true);
    });

    it('should display time delta for screenshots after the first', () => {
      const deltas = fixture.nativeElement.querySelectorAll('.frame-delta');
      // First screenshot shouldn't have delta
      expect(deltas.length).toBe(2);
    });

    it('should display total duration in header', () => {
      const header = fixture.nativeElement.querySelector('.film-strip-header');
      expect(header.textContent).toContain('s'); // Contains time unit
    });
  });
});

