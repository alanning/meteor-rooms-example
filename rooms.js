
Messages = new Meteor.Collection("messages");

if (Meteor.isServer) {
  Meteor.startup(function () {
    var bootstrap = true

    //bootstrap = (Messages.find().count() === 0)

    // code to run on server at startup
    if (bootstrap) {
      Messages.remove({});

      Messages.insert({roomId: 1, msg: "msg 1"});
      Messages.insert({roomId: 2, msg: "msg 1"});
      Messages.insert({roomId: 3, msg: "msg 1"});
      Messages.insert({roomId: 4, msg: "msg 1"});
    }
  });


  Meteor.methods({
    add: function (roomId) {
      var count;

      if (null === roomId || "undefined" == typeof roomId)
        return;

      count = Messages.find({roomId: roomId}).count();
      count++;
      Messages.insert({roomId: roomId, msg: "msg " + count});
    },
    remove: function (roomId) {
      var count,
          msg;

      if (null === roomId || "undefined" == typeof roomId)
        return;

      // remove the last message
      count = Messages.find({roomId: roomId}).count();
      if (count > 0) {
        msg = "msg " + count;
        Messages.remove({roomId: roomId, msg: msg});
      }
    }
  })

  // server: publish the current size of a collection
  Meteor.publish("counts-by-room", function (roomId) {
    var self = this;
    var count = 0;
    var initializing = true;

    if (null === roomId ||
        "undefined" == typeof roomId) {
      return;
    }

    console.log('client connected to room ' + roomId)

    var handle = Messages.find({roomId: roomId}).observeChanges({
      added: function (id) {
        var msg

        count++;
        msg = 'added msg to room ' + roomId + '. count: ' + count;

        if (initializing) {
          msg = 'init - ' + msg;
        }

        console.log(msg);

        if (!initializing)
          self.changed("counts", roomId, {count: count});
      },
      removed: function (id) {
        count--;
        console.log('removed msg from room ' + roomId + '. count: ' + count);
        self.changed("counts", roomId, {count: count});
      }
      // don't care about moved or changed
    });

    // Observe only returns after the initial added callbacks have
    // run.  Now return an initial value and mark the subscription
    // as ready.
    initializing = false;
    self.added("counts", roomId, {count: count});
    self.ready();

    console.log('publish ready')

    // Stop observing the cursor when client unsubs.
    // Stopping a subscription automatically takes
    // care of sending the client any removed messages.
    self.onStop(function () {
      handle.stop();
    });
  });



  // server: publish total number of messages
  Meteor.publish("total-message-count", function () {
    var self = this;
    var count = 0;
    var totalCountId = "total";
    var initializing = true;

    console.log('client connected')

    var handle = Messages.find().observeChanges({
      added: function (id) {
        var msg

        count++;
        msg = 'added msg. total message count: ' + count;

        if (initializing) {
          msg = 'init - ' + msg;
        }

        console.log(msg);

        if (!initializing)
          self.changed("counts", totalCountId, {count: count});
      },
      removed: function (id) {
        count--;
        console.log('removed msg. total message count: ' + count);
        self.changed("counts", totalCountId, {count: count});
      }
      // don't care about moved or changed
    });

    // Observe only returns after the initial added callbacks have
    // run.  Now return an initial value and mark the subscription
    // as ready.
    initializing = false;
    self.added("counts", totalCountId, {count: count});
    self.ready();

    console.log('total-message-count publish ready')

    // Stop observing the cursor when client unsubs.
    // Stopping a subscription automatically takes
    // care of sending the client any removed messages.
    self.onStop(function () {
      handle.stop();
    });
  });


}  // end server


if (Meteor.isClient) {

  Meteor.startup(function () {
    Session.set('roomId', 1);
    Session.set('count', 0);
  });

  // client: declare collection to hold count object
  Counts = new Meteor.Collection("counts");

  // client: subscribe to the count for the current room
  Meteor.autorun(function () {
    Meteor.subscribe("counts-by-room", Session.get("roomId"));
    Meteor.subscribe("total-message-count")
  });

  // client: use the new collection

  Template.hello.room = function () {
    return Session.get("roomId");
  };
  Template.hello.greeting = function () {
    return "Welcome to rooms.";
  };
  Template.hello.count = function () {
    var roomId = Session.get("roomId"),
        countObj = Counts.findOne({_id: roomId});

    console.log('count template helper executed. roomId ' + roomId);
    console.log(countObj);

    if (countObj) {
      return countObj.count;
    }
  };
  Template.hello.total_count = function () {
    var totalCountId = "total",
        countObj = Counts.findOne({_id: totalCountId});

    console.log('total_count template helper executed')
    console.log(countObj);

    if (countObj) {
      return countObj.count;
    }
  };

  Template.hello.events({
    'click #switch' : function () {
      // template data, if any, is available in 'this'
      var roomId = Session.get("roomId");

      roomId++;

      if (roomId > 4) {
        roomId = 1
      }

      Session.set("roomId", roomId);
    },
    'click #add' : function () {
      Meteor.call('add', Session.get('roomId'))
    },
    'click #remove' : function () {
      Meteor.call('remove', Session.get('roomId'))
    }
  });

}
