import Ember from 'ember';

export default Ember.Service.extend(Ember.Evented, {
  data: [],
  addItem(item) {
    let data = this.get('data');
    data.push(item);
    this.set('data', data);
    this.trigger('newItem');
  }
});
