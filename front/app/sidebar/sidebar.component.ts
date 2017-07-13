import { Component, OnInit } from '@angular/core';
import { ROUTES } from './sidebar-routes.config';

declare var $:any;
@Component({
    selector: 'sv-sidebar',
    templateUrl: 'sidebar.component.html',
})

export class SidebarComponent implements OnInit {
    public menuItems: any[];
    ngOnInit() {
        // $.getScript('../../assets/js/material-dashboard-angular.js');
        // this.menuItems = ROUTES.filter(menuItem => menuItem.menuType !== MenuType.BRAND);
        
    }
}
