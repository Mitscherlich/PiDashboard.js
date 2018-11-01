module.exports = class HomeController {
  async show (ctx) {
    await ctx.render('pages/home', {
      title: 'Home',
    })
  }
}
