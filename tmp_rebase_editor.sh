#!/bin/bash
# Auto-change first line from 'pick' to 'edit' for interactive rebase
sed -i '1s/^pick/edit/' "$1"
