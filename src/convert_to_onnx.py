import torch
import torch.nn as nn
import torch.nn.functional as F

class Netp(nn.Module): 
    def __init__(self):        
        super(Netp, self).__init__()        
        self.conv1 = nn.Conv2d(1, 6, 5)
        self.conv2 = nn.Conv2d(6, 16, 5)    
        self.fc1 = nn.Linear(16 * 4 * 4, 120)  
        self.fc2 = nn.Linear(120, 84)
#         self.fc3 = nn.Linear(84, 10)        

    def forward(self, x):
        # Max pooling over a (2, 2) window
        x = F.max_pool2d(F.relu(self.conv1(x)), (2, 2))
        # If the size is a square, you can specify with a single number
        x = F.max_pool2d(F.relu(self.conv2(x)), 2)
        x = torch.flatten(x, 1) # flatten all dimensions except the batch dimension
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
#         x = self.fc3(x)
#         output = F.softmax(x, dim=1)
        return x

def main():
  pytorch_model = Netp()
  pytorch_model.load_state_dict(torch.load('clientmodel.pt'))
  pytorch_model.eval()
  dummy_input = torch.reshape(torch.zeros(28 * 28 * 1),(1,1,28,28))
  torch.onnx.export(pytorch_model, dummy_input, 'clientmodel.onnx', verbose=True)


if __name__ == '__main__':
  main()
