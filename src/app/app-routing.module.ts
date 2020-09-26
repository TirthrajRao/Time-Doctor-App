import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// components //
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { CreateProjectComponent } from './create-project/create-project.component';
import { UserInviteComponent } from './user-invite/user-invite.component';
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
	},
	{
		path : 'signup',
		component : SignupComponent,
	},
	{
		path : 'create-project',
		component : CreateProjectComponent,
	},
	{
		path : 'user-invite',
		component : UserInviteComponent,
	}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
