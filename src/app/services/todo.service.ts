import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

export interface Note {
  id?: string;
  userId: string;
  category: string;
  status: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private _notes = new BehaviorSubject<Note[]>([]);

  get notes() {
    return this._notes.asObservable();
  }

  constructor(
    private firestore: Firestore,
  ) { }

  async addNote(userId: string, data: Omit<Note, 'userId'>) {
    try {
      const dataRef: any = collection(this.firestore, 'userTodos');
      const response = await addDoc(dataRef, { ...data, userId });
      const id = await response?.id;
      const currentNotes = this._notes.value;
      let notes: Note[] = [{ ...data, id, userId }]
      notes = notes.concat(currentNotes);
      this._notes.next(notes);
      return notes;
    } catch (e) {
      throw e;
    }
  }

  async getNotes(userId: string) {
    try {
      const dataRef: any = collection(this.firestore, 'userTodos');
      const querySnapshot = await getDocs(dataRef);
      const notes: Note[] = await querySnapshot.docs.map((doc) => {
        let item: any = doc.data();
        item.id = doc.id;
        return item as Note;
      }).filter(doc => doc.userId === userId);;
      this._notes.next(notes);
      return notes;
    } catch (e) {
      throw (e);
    }
  }

  async getNoteById(id: string) {
    try {
      const dataRef: any = doc(this.firestore, `userTodos/${id}`);
      const docSnap = await getDoc(dataRef);
      if (docSnap.exists()) {
        // return docSnap.data() as Note;
        let item: any = docSnap.data();
        item.id = docSnap.id;
        return { ...item } as Note;
      } else {
        console.log("No se encontro el documento");
        throw ("No se encontro la nota!");
      }
    } catch (e) {
      throw (e);
    }
  }

  async updateNote(id: string, userId: string, data: Partial<Omit<Note, 'id' | 'userId'>>) {
    try {
      const dataRef: any = doc(this.firestore, `userTodos/${id}`);
      const fullData = { ...data, userId };
      await updateDoc(dataRef, fullData);
      let currentNotes = this._notes.value;
      const index = currentNotes.findIndex(x => x.id == id && x.userId === userId);
      const updatedNote = { ...currentNotes[index], ...fullData };
      currentNotes[index] = updatedNote;
      this._notes.next(currentNotes);
      return updatedNote;
    } catch (e) {
      throw e;
    }
  }

  async updateTodoStatus(id: string, newStatus: number) {
    try {
      const docRef = doc(this.firestore, `userTodos/${id}`);
      await updateDoc(docRef, { status: newStatus });
      let currentNotes = this._notes.value;
      const index = currentNotes.findIndex(note => note.id === id);
      if (index !== -1) {
        const updateNote = { ...currentNotes[index], status: newStatus };
        currentNotes[index] = updateNote;
        this._notes.next(currentNotes)
      }
    } catch (e) {
      throw e;
    }
  }

  async deleteNote(id: string, userId: string) {
    try {
      const dataRef: any = doc(this.firestore, `userTodos/${id}`);
      await deleteDoc(dataRef);
      let currentNotes = this._notes.value;
      currentNotes = currentNotes.filter(x => x.id !== id || x.userId !== userId);
      this._notes.next(currentNotes);
    } catch (e) {
      throw e;
    }
  }

  clearNotes() {
    this._notes.next([]);
  }
}
