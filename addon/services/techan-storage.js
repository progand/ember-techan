import Ember from 'ember';

export default Ember.Service.extend(Ember.Evented, {
  data: [],
  addItem(item) {
    let data = this.get('data');
    if (data.length > 250) {
      data.shift();
    }
    data.push(item);
    this.set('data', data);
    console.log(data.length);
    this.trigger('newItem');
  }
});
