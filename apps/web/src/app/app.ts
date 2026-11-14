import { Component } from '@angular/core';
import { FileUploadComponent } from './components/file-upload/file-upload';
import { FilmStripSettingsDialogComponent } from './components/film-strip-settings-dialog/film-strip-settings-dialog';
import { PbIconButton } from './design-system';

@Component({
  imports: [FileUploadComponent, FilmStripSettingsDialogComponent, PbIconButton],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
