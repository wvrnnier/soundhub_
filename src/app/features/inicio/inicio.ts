import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-inicio', 
  standalone: true,
  imports: [RouterLink], 
  template: `<section class="inicio">
              <h1> SounHUB </h1>
              <p> Descubre escucha y crea </p>

<!-- Routerlink me crea enlaces entre rutas sin regargar la pagina -->
<a routerLink="/explorar" class = "btn-explorar"> Explorar </a>
</section>`,
styles: [`
  .inicio {
  text-align:center;
  margin-top: 80px;
  font-family: Arial, sans-serif;
  }

h1{
font-size:2.5rem;
color: #512DA8;
margin-bottom: 0.5rem;}
}
.btn {
display. inline-block;
margin-top: 1rem;´
padding: 10px 20px;
background-color: #512DA8;
color: white;
text-decoration: none;
border-radius: 8px;
transition: background-color 0.3s;
}
.btn:hover {
background-color: #311B92;
}
`]
})
export class InicioComponent {}
