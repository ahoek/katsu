import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';
import {InformationPage} from './information';
import {IonicModule, NavController} from 'ionic-angular/index';
import {GoogleAnalytics} from '@ionic-native/google-analytics';

describe('InformationPage', function () {
    let de: DebugElement;
    let comp: InformationPage;
    let fixture: ComponentFixture<InformationPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [InformationPage],
            imports: [
                IonicModule.forRoot(InformationPage)
            ],
            providers: [
                NavController,
                GoogleAnalytics
            ]
        });
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InformationPage);
        comp = fixture.componentInstance;
        de = fixture.debugElement.query(By.css('h2'));
    });

    it('should create component', () => expect(comp).toBeDefined());

    it('should have expected <h2> text', () => {
        fixture.detectChanges();
        const h2 = de.nativeElement;
        expect(h2.innerText).toMatch(/how/i,
            '<h2> should say something about "How"');
    });
});
