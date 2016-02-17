import Ember from 'ember';

export default Ember.Service.extend(Ember.Evented, {
  addItem(item) {
    this.trigger('newItem', item);
  }
});
