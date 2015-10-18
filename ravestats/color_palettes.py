import numpy as np
import matplotlib.pyplot as pl
from gma.colormaps import viridis


N = 25
for k, i in enumerate(np.linspace(0.0, 0.95, N)):
    rgb = np.array(np.array(pl.cm.gray(i)[:3]) * 256, dtype=int)

    print ".Gray .q%d-%d{fill:rgb(%d,%d,%d)}" % (k, N, rgb[0],
                                                    rgb[1], rgb[2])
