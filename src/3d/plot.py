from mpl_toolkits import mplot3d
import matplotlib.pyplot as plt
from matplotlib import cm

import json
import numpy as np

with open('embedding-10k.json') as f:
    res = json.load(f)

xy = np.array(res['embedding'])
c = np.array(res['accuracy'])
cmap = cm.get_cmap('viridis', 5)# discrete colors
s = 20

fig = plt.figure(figsize=[12,7]) 
ax = plt.axes(projection='3d')  
ax.scatter(xy[:,0], xy[:,1], xy[:,2], 
           vmin=0.8, vmax=1.0,
           # depthshade=True,
           # cmap=cmap, 
           c=c, s=s, 
           # alpha=0.9
           )
ax.view_init(elev=30, azim=10)
plt.show()