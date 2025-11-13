import { Component, HostBinding } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  templateUrl: './side-bar.html',
  styleUrls: ['./side-bar.css'],
  imports: [RouterLink],
})
export class SideBarComponent {
  expanded = false;//Estado interno , cuando true: Abierto y false: cerrado

  onMouseEnter() {
    console.log("ENTER");
    this.expanded = true;//cambia el estado de expansión
  }

  onMouseLeave() {
    console.log("LEAVE");
    this.expanded = false;// cambie el estado de expansión
  }

  @HostBinding('class.expanded')
  get isExpanded() { //getter que se evalúa para decidir si se añade la clase
    return this.expanded; // devolvemos valor de expanded.
  }
}

