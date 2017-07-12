import { SvapiPage } from './app.po';

describe('svapi App', function() {
  let page: SvapiPage;

  beforeEach(() => {
    page = new SvapiPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
