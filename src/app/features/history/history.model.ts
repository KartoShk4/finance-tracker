/**
 * Модель записи истории изменений
 */
export interface HistoryEntry {
  /** ID записи */
  id: string;
  
  /** Тип действия */
  action: 'created' | 'deleted' | 'updated';
  
  /** Тип сущности */
  entityType: 'item' | 'transaction';
  
  /** ID сущности */
  entityId: string;
  
  /** Название/описание сущности */
  entityTitle: string;
  
  /** Дата и время действия */
  timestamp: string;
  
  /** Дополнительная информация */
  details?: string;
}





