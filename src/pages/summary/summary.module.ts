
import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {SummaryPage} from './summary';

@NgModule({
    declarations: [
        SummaryPage,
    ],
    imports: [
        IonicPageModule.forChild(SummaryPage),
    ],
    exports: [
        SummaryPage
    ]
})
export class SummaryPageModule {}

