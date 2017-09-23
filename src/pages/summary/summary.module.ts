import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {SummaryPage} from './summary';
import {ComponentsModule} from './../../components/components.module';

@NgModule({
    declarations: [
        SummaryPage,
    ],
    imports: [
        IonicPageModule.forChild(SummaryPage),
        ComponentsModule
    ],
    exports: [
        SummaryPage
    ]
})
export class SummaryPageModule {}
