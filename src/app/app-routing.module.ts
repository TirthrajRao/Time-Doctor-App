import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// components //
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
	{
		path:"app",
		component : AppComponent
	},
	{
		path : 'login',
		component : LoginComponent
	},
	{
		path : 'home',
		component : HomeComponent
	}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
