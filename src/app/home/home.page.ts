import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { IonicModule, IonModal, ModalController } from '@ionic/angular';
import { OverlayEventDetail } from "@ionic/core/components"
import { Note, NoteService } from '../services/note/note.service';
import { Subscription } from 'rxjs';
import { PopoverContentComponent } from '../popover-content/popover-content.component';
import { PopoverController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonRefresher } from '@ionic/angular';
import { UserProfileModalComponent } from '../user-profile-modal/user-profile-modal.component';
import { TodoService } from '../services/todo.service';
import { AuthService } from '../services/auth/auth.service';
import * as Hammer from 'hammerjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('taskList', { static: true }) taskList!: ElementRef;
  @ViewChild(IonModal) modal!: IonModal;
  noteSub!: Subscription;
  model: any = { category: "personal", status: 0 };
  notes: any[] = [];
  isOpen: boolean = false;
  isEditing: boolean = false;
  userProfile: any = {};
  userId: string = '';
  isLoading: boolean = false;
  isLoadingButton: boolean = false;
  categories = ['business', 'personal'];
  private logoutSubscription: Subscription;

  constructor(private authService: AuthService, public note: TodoService, private popoverCtrl: PopoverController, private changeDetector: ChangeDetectorRef, private router: Router, private modalCtrl: ModalController) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && event.url === '/home')
    ).subscribe(() => {
      this.loadUserNotes();
      if (this.router.url !== '/home') {
        this.notes = [];
        this.userProfile = {};
      }
    });
    this.logoutSubscription = this.authService.onLogout.subscribe(() => {
      this.notes = [];
      this.userProfile = {};
    });
  }

  async ngOnInit() {
    try {
      const { value } = await Preferences.get({ key: 'user' });
      if (value) {
        this.userProfile = JSON.parse(value);
        this.userId = this.userProfile.uid;
        const userData = await this.authService.getUserData(this.userId);
        if (userData) {
          this.userProfile.name = userData.name;
          this.userProfile.photoUrl = userData.photoUrl;
        }
        this.loadUserNotes();
        this.changeDetector.detectChanges();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }
  async loadUserNotes() {
    this.isLoading = true;
    try {
      const notes = await this.note.getNotes(this.userId);
      this.notes = notes;
      this.noteSub = this.note.notes.subscribe(notes => {
        this.notes = notes;
        this.isLoading = false;
        this.changeDetector.detectChanges();
      });
    } catch (error) {
      console.error('Error loading notes:', error);
      this.isLoading = false;
    }
  }


  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    this.model = { category: "personal", status: 0 };
    this.isOpen = false;
    this.isEditing = false;
  }

  onSwipe(event: any, item: any): void {
    switch (event.direction) {
      case Hammer.DIRECTION_RIGHT:
        console.log("helloooo")
        this.onMove(item)
      break;
    }
  }

  onMove(item: any): void {
    this.note.deleteNote(item.id!, this.userId).then(() => {
      this.notes = this.notes.filter(note => note.id !== item.id);
    }).catch(error => {
      console.error('Error deleting note:', error);
    });
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async save(form: NgForm) {
    this.isLoadingButton = true;
    try {
      if (!form.valid) {
        return;
      }
      let dataToSend = {
        name: form.value.name,
        category: this.model.category,
        status: 0,
        userId: this.userId
      };

      if (this.model?.id) await this.note.updateNote(this.model.id, this.userId, dataToSend);
      else await this.note.addNote(this.userId, dataToSend);
      this.modal.dismiss();
    } catch (e) {
      console.log(e);
    } finally {
      this.isLoadingButton = false;
    }
  }

  async deleteNote(note: Note) {
    try {
      await this.note.deleteNote(note?.id!, this.userId);
    } catch (e) {
      console.log(e)
    }
  }

  async editNote(note: Note) {
    try {
      this.isOpen = true;
      this.isEditing = true;
      this.model = { ...note };
    } catch (e) {
      console.log(e)
    }
  }

  async presentPopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: PopoverContentComponent,
      event: ev,
      translucent: true
    });
    return await popover.present();
  }

  async doRefresh(event: any) {
    try {
      await this.loadUserNotes();
      event.target.complete();
    } catch (error) {
      console.error('Error refreshing notes:', error);
      event.target.complete();
    }
  }

  async onProfile() {
    const modal = await this.modalCtrl.create({
      component: UserProfileModalComponent,
    });
    return await modal.present();
  }

  ngOnDestroy(): void {
    if (this.noteSub) this.noteSub.unsubscribe();
    this.logoutSubscription.unsubscribe();
    this.notes = [];
    this.userProfile = {};
  }

  toggleCategory() {
    this.model.category = this.model.category === 'business' ? 'personal' : 'business';
  }

  async toggleStatus(item: any) {
    const newStatus = item.status === 1 ? 0 : 1;
    try {
      await this.note.updateTodoStatus(item.id!, newStatus);
    } catch (e) {
      console.log('Error', e);
    }
  }
}
