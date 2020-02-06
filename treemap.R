library(tidyverse)

# data = read_csv("spending-baseline.csv") %>% 
#   rename(func = `Function`) %>%
#   gather(key = year, value = value, 9:19) %>%
#   filter(!(func %in% c("920", "950"))) %>%
#   group_by(year, func) %>%
#   summarize(value = sum(value))
# 
# write_csv(data, "data.csv")

data = read_csv("spending-baseline.csv") %>%
  rename(func = `Function`) %>%
  gather(key = year, value = value, 9:19) %>%
  filter(!(func %in% c("920", "950"))) %>%
  group_by(year, func) %>%
  summarize(value = sum(value)) %>% 
  spread(key = year, value = value)

write_csv(data, "data-spread.csv")