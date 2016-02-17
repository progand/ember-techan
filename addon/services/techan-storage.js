import Ember from 'ember';

export default Ember.Service.extend(Ember.Evented, {
  data: [],
  addItem(item) {
    let data = this.get('data');
    if (data.length > 250) {
      data = data.slice(data.length-250, data.length);
    }
    data.push(item);
    this.set('data', data);
    this.trigger('newItem');
  },
  addItems(items) {
    let data = this.get('data');

    items.forEach((item) => {
      data.push(item);
    })
    if (data.length > 250) {
      data = data.slice(data.length-249, data.length);
    }
    this.set('data', data);
    this.trigger('newItem');
  }
});
