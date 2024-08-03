import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { AuthService } from '../services/auth/auth.service';
// import { NoteService } from '../services/note/note.service';
import { TodoService } from '../services/todo.service';

@Component({
  selector: 'app-popover-content',
  templateUrl: './popover-content.component.html',
  styleUrls: ['./popover-content.component.scss'],
})
export class PopoverContentComponent implements OnInit {
  constructor(private popoverCtrl: PopoverController, private modalCtrl: ModalController, private authService: AuthService, private noteService: TodoService) { }

  ngOnInit() { }

  async onLogout() {
    this.authService.logout();
    await this.noteService.clearNotes();
    this.popoverCtrl.dismiss();
  }
}
