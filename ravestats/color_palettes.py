import numpy as np
import matplotlib.pyplot as pl
from gma.colormaps import viridis


N = 25
for k, i in enumerate(np.linspace(0.0, 1.0, N)):
    rgb = np.array(np.array(viridis(i)[:3]) * 256, dtype=int)

    print ".Viridis .q%d-%d{fill:rgb(%d,%d,%d)}" % (k, N, rgb[0],
                                                    rgb[1], rgb[2])
