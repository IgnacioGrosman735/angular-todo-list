import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { Task } from '../task.model';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';


  @Component({
    selector: 'app-todo-list',
    standalone: true,
    imports: [NgFor, FormsModule, NgIf,ReactiveFormsModule, 
              MatFormFieldModule, MatInputModule, MatButtonModule,
              MatIconButton, MatIconModule, MatCheckboxModule
            ],
    templateUrl: './todo-list.component.html',
    styleUrl: './todo-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush // <-- Configuración OnPush
  })
  export class TodoListComponent {

    constructor() {
      try {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
          this.tasks.set(JSON.parse(savedTasks));
        }
      } catch (error) {
        console.error('Error al cargar las tareas desde localStorage', error);
      }
    
      effect(() => {
        try {
          localStorage.setItem('tasks', JSON.stringify(this.tasks()));
        } catch (error) {
          console.error('Error al guardar las tareas en localStorage', error);
        }
      });
    }

    // Estado inicial de las tareas
    tasks = signal<Task[]>([]);

    // Filtro actual (todas, completadas, pendientes)
    filter = signal<'all' | 'completed' | 'pending'>('all');

    // Filtro de texto
    filterText = signal<string>('');

    // Editar tarea
    editingTaskId = signal<number | null>(null); // ID de la tarea que se está editando

    // Determinar si todas las tareas están completadas
    allCompleted = computed(() =>
    this.tasks().every(task => task.completed)
  );

    // Lista filtrada (se calcula automáticamente al cambiar `tasks` o `filter`)
    filteredTasks = computed(() => {
      const currentFilter = this.filter();
      const currentFilterText = this.filterText().toLowerCase();
      return this.tasks().filter(task => {
        // Filtrar por texto si se ha introducido algo en el campo de búsqueda
        const matchesText = task.title.toLowerCase().includes(currentFilterText);

        if (currentFilter === 'all') return matchesText;
        if (currentFilter === 'completed') return task.completed && matchesText;
        if (currentFilter === 'pending') return !task.completed && matchesText;

        return false; // Caso por defecto (aunque no debería ocurrir)
      });
    });

    // Agregar una nueva tarea
    addTask(title: string) {
      const newTask: Task = {
        id: Date.now(),
        title,
        completed: false,
      };
      this.tasks.update(tasks => [...tasks, newTask]);
    } 

    // Marcar una tarea como completada
    toggleTaskCompletion(taskId: number) {
      this.tasks.update(tasks =>
        tasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      );
    }

    // Cambiar el filtro
    setFilter(newFilter: 'all' | 'completed' | 'pending') {
      this.filter.set(newFilter);
    }

    // Eliminar una tarea
    deleteTask(taskId: number) {
      this.tasks.update(tasks => tasks.filter(task => task.id !== taskId));
    }

    // Iniciar edición de una tarea
    startEditing(taskId: number) {
      this.editingTaskId.set(taskId);
    }
    
    confirmEditSafe(taskId: number, target: EventTarget | null) {
      const value = (target as HTMLInputElement)?.value || '';
      this.confirmEdit(taskId, value);
    }

    // Confirmar edición de una tarea
    confirmEdit(taskId: number, newTitle: string) {
      this.tasks.update(tasks =>
        tasks.map(task =>
          task.id === taskId ? { ...task, title: newTitle } : task
        )
      );
      this.editingTaskId.set(null); // Salir del modo de edición
    }

    // Contador de tareas pendientes
    pendingTasksCount = computed(() => {
      return this.tasks().filter(task => !task.completed).length;
    });

    // Marcar todas las tareas como completadas o pendientes
    toggleAllTasks() {
      const newCompletedState = !this.allCompleted(); // Invertir el estado
      this.tasks.update(tasks =>
        tasks.map(task => ({ ...task, completed: newCompletedState }))
      );
    }
  }
