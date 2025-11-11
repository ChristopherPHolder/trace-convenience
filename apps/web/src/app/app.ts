import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FileUploadComponent } from './components/file-upload/file-upload';

@Component({
  imports: [RouterModule, FileUploadComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'web';
}
