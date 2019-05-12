global_step=tf.Variable(0,trainable=false)
initial_learning_rate= 0.2
learning_rate=tf.train.ecponential_decay(initial_learning_rate,global_step,decay_steps=100000,decay_rate=0.95,staircase=Treu)
#pass this learning rate to optimizer as before