
import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {ReviewPage} from './review';

@NgModule({
    declarations: [
        ReviewPage,
    ],
    imports: [
        IonicPageModule.forChild(ReviewPage),
    ],
    exports: [
        ReviewPage
    ]
})
export class ReviewPageModule {}

