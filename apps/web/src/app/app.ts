import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FileUploadComponent } from './components/file-upload/file-upload';
import { FilmStripSettingsDialogComponent } from './components/film-strip-settings-dialog/film-strip-settings-dialog';

@Component({
  imports: [RouterModule, FileUploadComponent, FilmStripSettingsDialogComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'web';
}
